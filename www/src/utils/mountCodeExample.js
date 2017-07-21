import CodeEditor from '../components/CodeEditor';
import ReactDOM from 'react-dom';

// TODO This is a huge hack.
// Remark transform this template to split code examples and their targets apart.
const mountCodeExample = (containerId, code) => {
  const container = document.getElementById(containerId);
  const parent = container.parentElement;

  const children = Array.prototype.filter.call(
    parent.children,
    child => child !== container,
  );
  children.forEach(child => parent.removeChild(child));

  const description = children
    .map(child => child.outerHTML)
    .join('')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  ReactDOM.render(
    <CodeEditor code={code}>
      {<div dangerouslySetInnerHTML={{__html: description}} />}
    </CodeEditor>,
    container,
  );
};

export default mountCodeExample;
