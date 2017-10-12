const data = {
  name: 'Top Level',
  value: 20,
  children: [
    {
      name: 'Level 2: A', value: 20,
      children: [
        {
          name: 'Son of A', value: 20,
          children: [{ name: 'Grandson of A', value: 10, }, { name: 'Granddaughter of A', value: 10, }],
        },
        {
          name: 'Daughter of A', value: 20,
          children: [{ name: 'Grandson of A', value: 10, }, { name: 'Granddaughter of A', value: 10, }],
        }
      ],
    },
    {
      name: 'Level 2: B', value: 20,
      children: [{ name: 'Son of B', value: 10, }, { name: 'Daughter of B', value: 10, }],
    },
  ],
}

const margin = { top: 20, right: 50, bottom: 20, left: 50 },
  width = 900,
  height = 700

const svg = d3.select('.wrapper')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .append('g')
  .attr('transform', `translate(${margin.left + margin.right}, ${margin.top})`)

let i = 0
const duration = 500

const treeMap = d3.tree().size([height, width])

const root = d3.hierarchy(data, d => d.children)

root.x0 = height / 2
root.y0 = 20

// collapse children
root.children.forEach(collapse)
update(root)

function collapse(d) {
  if (d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

function update(source) {
  const treeData = treeMap(root)

  const nodes = treeData.descendants()
  const links = treeData.descendants().slice(1)

  // depth normalization
  nodes.forEach(d => d.y = d.depth * 180)

  // update nodes
  const node = svg.selectAll('g.node')
    .data(nodes, d => d.id || (d.id = ++i))

  const nodeEnter = node.enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${source.y0}, ${source.x0})`)
    .on('click', click)

  nodeEnter.append('circle')
    .attr('class', 'node')
    .attr('r', 1e-6)
    .style('fill', d => d._children ? 'lime' : 'orange')

  nodeEnter.append('text')
    .attr('dy', '.35em')
    .attr('x', d => d.children || d._children ? -25 : 25)
    .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
    .text(d => d.data.name)

  const nodeUpdate = nodeEnter.merge(node)

  // transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr('transform', d => `translate(${d.y}, ${d.x})`)

  // update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', d => d.value)
    .style('fill', d => d._children ? 'lime' : 'orange')
    .attr('cursor', 'pointer')

  // remove nodes if exists
  const nodeExit = node.exit().transition()
    .duration(duration)
    .attr('transform', d => `translate(${source.y}, ${source.x})`)
    .remove()

  // on exit remove labels and circles
  nodeExit.select('circle')
    .attr('r', 1e-6)

  nodeExit.select('text')
    .style('fill-opacity', 1e-6)

  // update links
  const link = svg.selectAll('path.link')
    .data(links, d => d.id)

  // on enter take parents previous position
  const linkEnter = link.enter().insert('path', 'g')
    .attr('class', 'link')
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 }
      return diagonal(o, o)
    })

  const linkUpdate = linkEnter.merge(link)

  // transition back to the parent element position
  linkUpdate.transition()
    .duration(duration)
    .attr('d', d => diagonal(d, d.parent))

  // remove links if exists
  const linkExit = link.exit().transition()
    .duration(duration)
    .attr('d', d => {
      const o = { x: source.x, y: source.y }
      return diagonal(o, o)
    })
    .remove()

  // keep old positions
  nodes.forEach(d => {
    d.x0 = d.x
    d.y0 = d.y
  })

  function diagonal(s, d) {
    const path = `M ${s.y} ${s.x}
          C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`

    return path
  }

  function click(d) {
    if (d.children) {
      d._children = d.children
      d.children = null
    } else {
      d.children = d._children
      d._children = null
    }
    update(d)
  }
}
