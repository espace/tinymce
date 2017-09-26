define(
  'ephox.robin.demo.WordSelectDemo',

  [
    'ephox.katamari.api.Fun',
    'ephox.robin.api.dom.DomSmartSelect',
    'ephox.sugar.api.events.DomEvent',
    'ephox.sugar.api.node.Element',
    'ephox.sugar.api.dom.Insert',
    'ephox.sugar.api.search.SelectorFind',
    'global!console',
    'global!document',
    'global!window'
  ],

  function (Fun, DomSmartSelect, DomEvent, Element, Insert, SelectorFind, console, document, window) {
    return function () {
      var ephoxUi = SelectorFind.first('#ephox-ui').getOrDie();

      var editor = Element.fromHtml('<div contenteditable="true" style="width: 500px; height: 300px; border: 1px solid black;">' +
        'This is <span style="color: red;">som</span>eth<b>ing that you should</b> see.<img src="http://www.google.com/google.jpg">The<br>dog</div>');

      Insert.append(ephoxUi, editor);

      var select = function (s, so, f, fo) {
        var selection = window.getSelection();
        selection.removeAllRanges();
        var range = document.createRange();
        range.setStart(s.dom(), so);
        range.setEnd(f.dom(), fo);
        console.log('setting range: ', s.dom(), so, f.dom(), fo);
        selection.addRange(range);
      };

      var getSelection = function () {
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
          var range = selection.getRangeAt(0);
          console.log('range: ', range);
          return {
            startContainer: Fun.constant(Element.fromDom(range.startContainer)),
            startOffset: Fun.constant(range.startOffset),
            endContainer: Fun.constant(Element.fromDom(range.endContainer)),
            endOffset: Fun.constant(range.endOffset),
            collapsed: Fun.constant(range.collapsed)
          };
        } else {
          return null;
        }
      };

      DomEvent.bind(editor, 'click', function (event) {
        var current = getSelection();
        if (current !== null && current.collapsed()) {
          var wordRange = DomSmartSelect.word(current.startContainer(), current.startOffset(), Fun.constant(false));
          wordRange.each(function (wr) {
            select(wr.startContainer(), wr.startOffset(), wr.endContainer(), wr.endOffset());
          });
        }
      });
    };
  }
);