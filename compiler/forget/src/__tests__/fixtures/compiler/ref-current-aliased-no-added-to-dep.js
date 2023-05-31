// @validateRefAccessDuringRender false
function VideoTab() {
  const ref = useRef();
  const t = ref.current;
  let x = () => {
    t;
  };

  return <VideoList videos={x} />;
}
