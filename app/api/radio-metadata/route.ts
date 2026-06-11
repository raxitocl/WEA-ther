import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

export const dynamic = 'force-dynamic';

interface CacheEntry {
  title: string;
  timestamp: number;
}

const metadataCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<string>>();
const CACHE_TTL_MS = 15000; // 15 seconds cache
const MAX_CACHE_SIZE = 50;

function getStreamMetadata(streamUrl: string, redirectDepth = 0): Promise<string> {
  if (redirectDepth > 5) {
    return Promise.reject(new Error('Too many redirects'));
  }
  
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(streamUrl);
      const requester = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = requester.get(
        streamUrl,
        {
          headers: {
            'Icy-MetaData': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WEA-ther/1.0',
            'Accept': '*/*'
          },
          timeout: 4000
        },
        (res) => {
          // Handle HTTP redirect (301, 302, 307, 308)
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, streamUrl).href;
            res.destroy();
            req.destroy();
            getStreamMetadata(redirectUrl, redirectDepth + 1).then(resolve).catch(reject);
            return;
          }
          
          if (res.statusCode && res.statusCode >= 400) {
            res.destroy();
            req.destroy();
            reject(new Error(`Server returned status code ${res.statusCode}`));
            return;
          }

          const metaIntStr = res.headers['icy-metaint'];
          if (!metaIntStr) {
            // No ICY metadata support in this stream
            res.destroy();
            req.destroy();
            resolve('');
            return;
          }

          const metaInt = parseInt(Array.isArray(metaIntStr) ? metaIntStr[0] : metaIntStr, 10);
          if (isNaN(metaInt) || metaInt <= 0) {
            res.destroy();
            req.destroy();
            resolve('');
            return;
          }

          let state: 'audio' | 'length' | 'metadata' = 'audio';
          let audioBytesToSkip = metaInt;
          let metadataBytesToRead = 0;
          let metadataChunks: Buffer[] = [];

          // Safety timeout to prevent hanging the API request on slow connections
          const safetyTimeout = setTimeout(() => {
            res.destroy();
            req.destroy();
            resolve('');
          }, 6000);

          res.on('data', (chunk: Buffer) => {
            let offset = 0;
            while (offset < chunk.length) {
              if (state === 'audio') {
                const remainingAudio = chunk.length - offset;
                if (remainingAudio >= audioBytesToSkip) {
                  offset += audioBytesToSkip;
                  audioBytesToSkip = metaInt;
                  state = 'length';
                } else {
                  audioBytesToSkip -= remainingAudio;
                  offset += remainingAudio;
                }
              } else if (state === 'length') {
                const lengthByte = chunk[offset];
                offset += 1;
                if (lengthByte > 0) {
                  metadataBytesToRead = lengthByte * 16;
                  metadataChunks = [];
                  state = 'metadata';
                } else {
                  state = 'audio';
                  audioBytesToSkip = metaInt;
                }
              } else if (state === 'metadata') {
                const remainingChunk = chunk.length - offset;
                if (remainingChunk >= metadataBytesToRead) {
                  metadataChunks.push(chunk.subarray(offset, offset + metadataBytesToRead));
                  offset += metadataBytesToRead;
                  
                  clearTimeout(safetyTimeout);
                  const metaBuffer = Buffer.concat(metadataChunks);
                  // SHOUTcast usually uses ISO-8859-1 or UTF-8. Try UTF-8 first, fallback to Latin-1
                  let metaStr = metaBuffer.toString('utf-8');
                  if (metaStr.includes('\ufffd')) {
                    metaStr = metaBuffer.toString('latin1');
                  }
                  
                  const match = metaStr.match(/StreamTitle='([^']*)'/);
                  const title = match ? match[1] : '';
                  
                  res.destroy();
                  req.destroy();
                  resolve(title.trim());
                  return;
                } else {
                  metadataChunks.push(chunk.subarray(offset));
                  metadataBytesToRead -= remainingChunk;
                  offset += remainingChunk;
                }
              }
            }
          });

          res.on('end', () => {
            clearTimeout(safetyTimeout);
            resolve('');
          });

          res.on('close', () => {
            clearTimeout(safetyTimeout);
          });

          res.on('error', (err) => {
            clearTimeout(safetyTimeout);
            reject(err);
          });
        }
      );

      req.on('error', (err) => {
        reject(err);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // 1. Check cache first
  const now = Date.now();
  const cached = metadataCache.get(url);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json({ title: cached.title });
  }

  try {
    // 2. Reuse pending promise if already fetching
    let pending = pendingRequests.get(url);
    if (!pending) {
      pending = getStreamMetadata(url).finally(() => {
        pendingRequests.delete(url);
      });
      pendingRequests.set(url, pending);
    }
    
    const title = await pending;

    // 3. Cache the resolved value
    if (metadataCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = metadataCache.keys().next().value;
      if (oldestKey !== undefined) {
        metadataCache.delete(oldestKey);
      }
    }
    metadataCache.set(url, { title, timestamp: Date.now() });

    return NextResponse.json({ title });
  } catch (error: any) {
    // Log as a regular console.log to avoid polluting stderr (Next.js Error console) with expected external network timeouts/errors
    console.log(`[Radio Metadata] Warning fetching metadata: ${error.message || error}`);
    return NextResponse.json({ title: '', error: error.message || 'Failed to fetch metadata' });
  }
}
