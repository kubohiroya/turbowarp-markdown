declare const Scratch: {
  extensions: {
    unsandboxed: boolean;
    register(extension: unknown): void;
  };
  BlockType: {REPORTER: string};
  ArgumentType: {STRING: string; NUMBER: string};
};
