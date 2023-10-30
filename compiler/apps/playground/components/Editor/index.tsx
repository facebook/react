import dynamic from "next/dynamic";

// monaco-editor is currently not compatible with ssr
// https://github.com/vercel/next.js/issues/31692
const Editor = dynamic(() => import("./EditorImpl"), {
  ssr: false,
});

export default Editor;