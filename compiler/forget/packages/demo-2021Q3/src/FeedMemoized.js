import React, { useRef, useCallback } from "react";

function FeedItem({ data, onClick }) {
  const rerenderCount = useRef(0);

  return (
    <a href={`./item/${data.value}`} className="FeedItem" onClick={onClick}>
      {rerenderCount.current++}
    </a>
  );
}
const FeedItemMemoized = React.memo(FeedItem);

export const Feed = React.memo(({ items }) => {
  const rerenderCount = useRef(0);

  const onClick = useCallback((e) => {
    e.preventDefault();
    alert(e.target.href);
  }, []);

  return (
    <div className="Feed">
      <h3>{rerenderCount.current++}</h3>
      {items.map((item, index) => (
        <FeedItemMemoized key={index} data={item} onClick={onClick} />
      ))}
    </div>
  );
});
