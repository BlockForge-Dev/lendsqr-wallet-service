type LogMetadata = Record<string, unknown>;

export const logger = {
  info(message: string, metadata?: LogMetadata): void {
    console.info(message, metadata ?? '');
  },

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(message, metadata ?? '');
  },

  error(message: string, metadata?: LogMetadata): void {
    console.error(message, metadata ?? '');
  },
};
