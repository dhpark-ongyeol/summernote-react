/**
 * @summernote/core — headless, framework-agnostic editor engine.
 *
 * Phase 0 stub: proves the ESM + CJS + .d.ts build pipeline and the zero-runtime-dep
 * boundary. The real engine (dom/range/editing ported 1:1 from summernote, typed
 * command registry, EventBus, structural EditorState) lands in Phase 1-2.
 */

export const CORE_VERSION = '0.0.0';

export interface EditorCoreStub {
  readonly version: string;
}
