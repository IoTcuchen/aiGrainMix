// web/app/actions.ts
'use server';

export async function logToServer(message: string, data?: any) {
  console.log(`\n================= [SERVER LOG] =================`);
  console.log(`MSG: ${message}`);
  if (data) console.log(`DATA:`, data);
  console.log(`================================================\n`);
}