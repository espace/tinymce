/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Arr, Fun } from '@ephox/katamari';
import { Element, Traverse } from '@ephox/sugar';
import CaretPosition from '../caret/CaretPosition';
import * as DeleteElement from './DeleteElement';
import * as DeleteUtils from './DeleteUtils';
import * as ElementType from '../dom/ElementType';
import * as Parents from '../dom/Parents';
import * as CaretFormat from '../fmt/CaretFormat';
import Editor from '../api/Editor';

const getParentInlines = function (rootElm, startElm) {
  const parents = Parents.parentsAndSelf(startElm, rootElm);
  return Arr.findIndex(parents, ElementType.isBlock).fold(
    Fun.constant(parents),
    function (index) {
      return parents.slice(0, index);
    }
  );
};

const hasOnlyOneChild = function (elm) {
  return Traverse.children(elm).length === 1;
};

const deleteLastPosition = function (forward: boolean, editor: Editor, target, parentInlines) {
  const isFormatElement = Fun.curry(CaretFormat.isFormatElement, editor);
  const formatNodes = Arr.map(Arr.filter(parentInlines, isFormatElement), function (elm) {
    return elm.dom();
  });

  if (formatNodes.length === 0) {
    DeleteElement.deleteElement(editor, forward, target);
  } else {
    const pos = CaretFormat.replaceWithCaretFormat(target.dom(), formatNodes);
    editor.selection.setRng(pos.toRange());
  }
};

const deleteCaret = function (editor: Editor, forward: boolean) {
  const rootElm = Element.fromDom(editor.getBody());
  const startElm = Element.fromDom(editor.selection.getStart());
  const parentInlines = Arr.filter(getParentInlines(rootElm, startElm), hasOnlyOneChild);

  return Arr.last(parentInlines).map(function (target) {
    const fromPos = CaretPosition.fromRangeStart(editor.selection.getRng());
    if (DeleteUtils.willDeleteLastPositionInElement(forward, fromPos, target.dom()) && !CaretFormat.isEmptyCaretFormatElement(target)) {
      deleteLastPosition(forward, editor, target, parentInlines);
      return true;
    } else {
      return false;
    }
  }).getOr(false);
};

const backspaceDelete = function (editor: Editor, forward: boolean) {
  return editor.selection.isCollapsed() ? deleteCaret(editor, forward) : false;
};

export {
  backspaceDelete
};
