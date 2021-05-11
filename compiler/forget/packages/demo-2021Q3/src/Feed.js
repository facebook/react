import React, { useRef } from "react";

function FeedItem({ data, onClick }) {
  const rerenderCount = useRef(0);

  return (
    <a href={`./item/${data.value}`} className="FeedItem" onClick={onClick}>
      {rerenderCount.current++}
    </a>
  );
}

export function Feed({ items }) {
  const rerenderCount = useRef(0);
  const onClick = (e) => {
    e.preventDefault();
    alert(e.target.href);
  };

  return (
    <div className="Feed">
      <h3>{rerenderCount.current++}</h3>
      {items.map((item, index) => (
        <FeedItem key={index} data={item} onClick={onClick} />
      ))}
    </div>
  );
}
