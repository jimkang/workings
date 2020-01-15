import { Project, ForceSource, Thing, NumberProp } from '../types';
var d3 = require('d3-selection');
var accessor = require('accessor');
var { drag } = require('d3-drag');
var { forceSimulation, forceCollide } = require('d3-force');
var { zoom } = require('d3-zoom');

const minIntervalForRestartingSim = 100;

var simulation;
var boardSel = d3.select('#board');
var zoomRootSel = d3.select('#zoom-root');

var zoomer = zoom().on('zoom', onZoom);
boardSel.call(zoomer);

export function renderMap({
  projectData,
  forceSourceData,
  selectedProject,
  selectedForceSource,
  thingRadius = 5,
  onSelectProject,
  onSelectForceSource,
  onChangeForceSource
}: {
  projectData: Array<Project>;
  forceSourceData: Array<ForceSource>;
  selectedProject: Project;
  selectedForceSource: ForceSource;
  thingRadius?: number;
  onSelectProject: (Project) => void;
  onSelectForceSource: (ForceSource) => void;
  onChangeForceSource: (ForceSource) => void;
}) {
  var posLastUpdatedTime = 0.0;

  var applyDragBehavior = drag()
    .container(boardSel.node())
    .on('end', onChangeForceSource)
    .on('drag', updateForceSourcePosition);

  var simulationNeedsRestart = true;
  if (!simulation) {
    simulation = forceSimulation();
    simulationNeedsRestart = false;
  }
  simulation
    .force('forceSources', updateProjectChitVelocities)
    //.velocityDecay(0)
    //.alphaDecay(0)
    .force('separation', forceCollide(thingRadius).strength(0.3))
    .alpha(0.1)
    .nodes((projectData as Array<Thing>).concat(forceSourceData as Array<Thing>))
    .on('tick', renderProjectChits);
  if (simulationNeedsRestart) {
    restartSimulationInEarnest(minIntervalForRestartingSim + 1);
  }

  renderThings(
    forceSourceData,
    'forceSource',
    onSelectForceSource,
    selectedForceSource
  ).call(applyDragBehavior);

  function renderProjectChits() {
    renderThings(projectData, 'project', onSelectProject, selectedProject);
  }

  function updateForceSourcePosition(forceSource) {
    forceSource.fx += d3.event.dx;
    forceSource.fy += d3.event.dy;
    d3.select(this).attr('transform', getTransform(forceSource));
    restartSimulationInEarnest(d3.event.timeStamp);
  }

  function restartSimulationInEarnest(timeStamp: number) {
    if (timeStamp - posLastUpdatedTime >= minIntervalForRestartingSim) {
      posLastUpdatedTime = timeStamp;
      simulation.alpha(1);
      simulation.restart();
    }
  }

  function updateProjectChitVelocities(alpha) {
    var projects = projectData;
    for (var i = 0, n = projects.length, project, k = alpha; i < n; ++i) {
      project = projects[i];
      for (let j = 0; j < forceSourceData.length; ++j) {
        let forceSource = forceSourceData[j];
        const attraction = getAttraction(forceSource, project);
        const xDiff = forceSource.x - project.x;
        const yDiff = forceSource.y - project.y;
        project.vx += xDiff * k * attraction;
        project.vy += yDiff * k * attraction;
      }
    }
  }

  function renderThings(
    thingData: Array<Thing>,
    className: string,
    onSelectThing: (Thing) => void,
    selectedThing: Thing
  ) {
    var thingRoot = d3.select(`#${className}-root`);
    var things = thingRoot
      .selectAll('.' + className)
      .data(thingData, accessor());
    things.exit().remove();
    var newThings = things
      .enter()
      .append('g')
      .classed(className, true)
      .classed('chit', true)
      .on('click', onClickThing);

    newThings
      .append('circle')
      .attr('r', thingRadius)
      .attr('cx', thingRadius)
      .attr('cy', thingRadius);
    newThings
      .append('foreignObject')
      .attr('width', thingRadius * 2)
      .attr('height', thingRadius * 2)
      // Never forget: Using the namespace when appending an html
      // element to a foreignObject is incredibly important. Without it,
      // a div will not size itself correctly for its contents.
      .append('xhtml:div')
      .classed('name-container', true)
      .append('xhtml:div')
      .classed('name', true);

    var currentThings = newThings.merge(things);
    currentThings.select('.name').text(accessor('name'));
    currentThings.attr('transform', getTransform);
    currentThings.classed('selected', isSelected);

    return currentThings;

    function isSelected(thing: Thing) {
      return selectedThing && thing.id === selectedThing.id;
    }

    function onClickThing(thing: Thing) {
      if (className === 'project') {
        onSelectThing({ projectId: thing.id });
      } else if (className === 'forceSource') {
        onSelectThing({ forceSourceId: thing.id });
      } else {
        throw Error('Unknown Thing was clicked.');
      }
    }
  }
}

function getTransform(thing: Thing) {
  return `translate(${thing.x}, ${thing.y})`;
}

function getAttraction(forceSource: ForceSource, project: Project): number {
  var attraction = 0.0;
  for (var i = 0; i < forceSource.numberProps.length; ++i) {
    let forceSourceProp: NumberProp = forceSource.numberProps[i];
    for (let j = 0; j < project.numberProps.length; ++j) {
      let projectProp: NumberProp = project.numberProps[j];
      if (projectProp.name === forceSourceProp.name) {
        attraction += 1.0 - Math.abs(projectProp.value - forceSourceProp.value);
      }
    }
  }
  return attraction;
}

function onZoom() {
  zoomRootSel.attr('transform', d3.event.transform);
}
