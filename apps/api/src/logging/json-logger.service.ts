import { Injectable, LoggerService } from "@nestjs/common";

type LogLevel = "debug" | "info" | "warn" | "error";

@Injectable()
export class JsonLoggerService implements LoggerService {
  private write(level: LogLevel, message: unknown, context?: string, trace?: string) {
    const payload = {
      ts: new Date().toISOString(),
      level,
      context: context ?? "App",
      msg: typeof message === "string" ? message : JSON.stringify(message),
      trace,
    };

    const line = JSON.stringify(payload);
    if (level === "error") {
      process.stderr.write(`${line}\n`);
      return;
    }
    process.stdout.write(`${line}\n`);
  }

  log(message: unknown, context?: string) {
    this.write("info", message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write("error", message, context, trace);
  }

  warn(message: unknown, context?: string) {
    this.write("warn", message, context);
  }

  debug(message: unknown, context?: string) {
    this.write("debug", message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write("debug", message, context);
  }
}
