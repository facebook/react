let latestNodeId = 1

export default function TextNode (text) {
  this.instanceId = ''
  this.nodeId = latestNodeId++
  this.parentNode = null
  this.nodeType = 3
  this.text = text
}
