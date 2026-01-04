const isDev = process.env.NODE_ENV !== "production";

export function logTool<TInput, TOutput>(
  name: string,
  fn: (input: TInput) => Promise<TOutput>,
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput) => {
    if (isDev) {
      console.log(`\n🔧 [TOOL] ${name}`);
      console.log("📥 Input:", JSON.stringify(input, null, 2));
    }
    const start = Date.now();
    try {
      const result = await fn(input);
      if (isDev) {
        console.log(`📤 Output:`, JSON.stringify(result, null, 2));
        console.log(`⏱️  Duration: ${Date.now() - start}ms\n`);
      }
      return result;
    } catch (error) {
      if (isDev) {
        console.error(`❌ Error:`, error);
        console.log(`⏱️  Duration: ${Date.now() - start}ms\n`);
      }
      throw error;
    }
  };
}
