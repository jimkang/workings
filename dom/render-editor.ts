import { Thing, ThingType } from '../types';
var cloneDeep = require('lodash.clonedeep');
var d3 = require('d3-selection');
import { renderProps } from './render-props';
var wireContentEditable = require('./wire-contenteditable');

// Whether or not an editor's container is visible or
// not is handled in renderTopLevelToggles, not here.
export function renderEditor({
  thing,
  thingType,
  onChange,
  onAddProp,
  onDeleteThing
}: {
  thing: Thing;
  thingType: ThingType;
  onChange: (Thing) => void;
  onAddProp: (Thing) => void;
  onDeleteThing: (Thing) => void;
}) {
  var editor = d3.select(`#${thingType}-sheet`);
  var label = editor.select('.name');
  editor.selectAll(':not(.name)').classed('hidden', !thing);

  if (!thing) {
    label.text(`[No ${thingType} selected.]`);
    return;
  }

  wireContentEditable({
    editableSelection: label,
    initialValue: thing.name,
    onContentChanged: onNameChanged
  });

  renderProps(thing, thingType, onChange);
  var editor = d3.select(`#${thingType}-sheet`);
  editor.select('.add-prop-button').on('click', onAddPropClick);
  editor.select('.delete-button').on('click', onDeleteClick);

  function onNameChanged(newText) {
    var copy = cloneDeep(thing);
    copy.name = newText;
    onChange(copy);
  }

  function onAddPropClick() {
    onAddProp(thing);
  }

  function onDeleteClick() {
    // TODO: Confirmation.
    onDeleteThing(thing);
  }
}
