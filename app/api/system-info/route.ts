import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

const getCpuUsage = async (): Promise<number> => {
  const startTicks = os.cpus();
  await new Promise((resolve) => setTimeout(resolve, 100));
  const endTicks = os.cpus();
  
  let totalDifference = 0;
  let idleDifference = 0;
  
  for (let i = 0; i < startTicks.length; i++) {
    const start = startTicks[i].times;
    const end = endTicks[i]?.times;
    if (!end) continue;
    
    const startTotal = start.user + start.nice + start.sys + start.idle + start.irq;
    const endTotal = end.user + end.nice + end.sys + end.idle + end.irq;
    
    totalDifference += (endTotal - startTotal);
    idleDifference += (end.idle - start.idle);
  }
  
  if (totalDifference === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDifference / totalDifference) * 100)));
};

export async function GET() {
  try {
    const cpu = await getCpuUsage();
    
    // Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    const processMemory = process.memoryUsage();
    
    // Host Platform info (non-sensitive)
    const platformMap: Record<string, string> = {
      win32: 'Windows',
      darwin: 'macOS',
      linux: 'Linux',
      freebsd: 'FreeBSD'
    };
    const platform = platformMap[process.platform] || process.platform;
    const arch = os.arch();
    
    return NextResponse.json({
      nextVersion: '16.2.6',
      reactVersion: '19.2.4',
      nodeVersion: process.version,
      platform: `${platform} (${arch})`,
      cpuUsage: cpu,
      systemMemory: {
        total: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10, // in GB
        used: Math.round(usedMem / (1024 * 1024 * 1024) * 10) / 10, // in GB
        percent: Math.round((usedMem / totalMem) * 100)
      },
      processMemory: {
        rss: Math.round(processMemory.rss / (1024 * 1024)), // in MB
        heapUsed: Math.round(processMemory.heapUsed / (1024 * 1024)) // in MB
      },
      uptime: Math.round(process.uptime()) // in seconds
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
