export default async function Hi() {
  return (
    <iframe
      src="https://jisho.org/search/家"
      loading="eager"
      style={{
        overflow: "hidden",
        overflowX: "hidden",
        overflowY: "hidden",
        height: "100%",
        width: "100%",
        position: "absolute",
        top: "0px",
        left: "0px",
        right: "0px",
        bottom: "0px",
      }}
      height="100%"
      width="100%"
    />
  );
}
