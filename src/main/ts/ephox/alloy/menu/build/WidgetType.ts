import { FieldSchema } from '@ephox/boulder';
import { Merger, Option } from '@ephox/katamari';

import * as EditableFields from '../../alien/EditableFields';
import * as Behaviour from '../../api/behaviour/Behaviour';
import { Focusing } from '../../api/behaviour/Focusing';
import { Keying } from '../../api/behaviour/Keying';
import { Representing } from '../../api/behaviour/Representing';
import * as AlloyEvents from '../../api/events/AlloyEvents';
import * as NativeEvents from '../../api/events/NativeEvents';
import * as SystemEvents from '../../api/events/SystemEvents';
import * as Fields from '../../data/Fields';
import * as AlloyParts from '../../parts/AlloyParts';
import * as ItemEvents from '../util/ItemEvents';
import * as WidgetParts from './WidgetParts';
import { SimulatedEvent, NativeSimulatedEvent } from '../../events/SimulatedEvent';
import { AlloyComponent } from '../../api/component/ComponentApi';
import { WidgetItemDetail } from 'ephox/alloy/ui/types/ItemTypes';

const builder = (detail: WidgetItemDetail) => {
  const subs = AlloyParts.substitutes(WidgetParts.owner(), detail, WidgetParts.parts());
  const components = AlloyParts.components(WidgetParts.owner(), detail, subs.internals());

  const focusWidget = (component) => {
    return AlloyParts.getPart(component, detail, 'widget').map((widget) => {
      Keying.focusIn(widget);
      return widget;
    });
  };

  const onHorizontalArrow = (component: AlloyComponent, simulatedEvent: NativeSimulatedEvent) => {
    return EditableFields.inside(simulatedEvent.event().target()) ? Option.none() : (() => {
      if (detail.autofocus()) {
        simulatedEvent.setSource(component.element());
        return Option.none();
      } else {
        return Option.none();
      }
    })();
  };

  return Merger.deepMerge({
    dom: detail.dom(),
    components,
    domModification: detail.domModification(),
    events: AlloyEvents.derive([
      AlloyEvents.runOnExecute((component, simulatedEvent) => {
        focusWidget(component).each((widget) => {
          simulatedEvent.stop();
        });
      }),

      AlloyEvents.run(NativeEvents.mouseover(), ItemEvents.onHover),

      AlloyEvents.run(SystemEvents.focusItem(), (component, simulatedEvent) => {
        if (detail.autofocus()) { focusWidget(component); } else { Focusing.focus(component); }
      })
    ]),
    behaviours: Behaviour.derive([
      Representing.config({
        store: {
          mode: 'memory',
          initialValue: detail.data()
        }
      }),
      Focusing.config({
        onFocus (component) {
          ItemEvents.onFocus(component);
        }
      }),
      Keying.config({
        mode: 'special',
        // This is required as long as Highlighting tries to focus the first thing (after focusItem fires)
        focusIn: detail.autofocus() ? (component) => {
          focusWidget(component);
        } : Behaviour.revoke(),
        onLeft: onHorizontalArrow,
        onRight: onHorizontalArrow,
        onEscape (component, simulatedEvent) {
          // If the outer list item didn't have focus,
          // then focus it (i.e. escape the inner widget). Only do if not autofocusing
          // Autofocusing should treat the widget like it is the only item, so it should
          // let its outer menu handle escape
          if (! Focusing.isFocused(component) && !detail.autofocus()) {
            Focusing.focus(component);
            return Option.some(true);
          } else if (detail.autofocus()) {
            simulatedEvent.setSource(component.element());
            return Option.none();
          } else {
            return Option.none();
          }
        }
      })
    ])
  });
};

const schema = [
  FieldSchema.strict('uid'),
  FieldSchema.strict('data'),
  FieldSchema.strict('components'),
  FieldSchema.strict('dom'),
  FieldSchema.defaulted('autofocus', false),
  FieldSchema.defaulted('domModification', { }),
  // We don't have the uid at this point
  AlloyParts.defaultUidsSchema(WidgetParts.parts()),
  Fields.output('builder', builder)
];

export default <any> schema;