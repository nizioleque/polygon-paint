import Line from '../class/Line';
import Point from '../class/Point';
import Polygon from '../class/Polygon';
import { DrawState, EditorMode } from '../types';
import { canClosePolygon, findHoveredElement } from '../utils';

export default function mouseMove(
  editorMode: EditorMode,
  mousePoint: Point,
  drawState: DrawState,
  polygons: Polygon[]
) {
  switch (editorMode) {
    case EditorMode.Draw:
      addMode();
      break;
    case EditorMode.Move:
      moveMode();
      break;
    case EditorMode.Delete:
      deleteMode();
      break;
    case EditorMode.Split:
      splitMode();
      break;
    case EditorMode.SetLength:
      setLengthMode();
      break;
    case EditorMode.SetPerpendicular:
      setPerpendicularMode();
      break;
  }

  function addMode() {
    if (!drawState.drawingStart) return;
    drawState.drawingLine!.setEnd(mousePoint);
    if (canClosePolygon(drawState))
      drawState.polygonStart?.isAt(mousePoint, true);
  }

  function moveMode() {
    const draggedElement = drawState.draggedLine || drawState.draggedPoint;
    if (draggedElement && drawState.isShiftPressed) {
      // Drag the entire polygon
      const offsetX = mousePoint.x - drawState.dragStart!.x;
      const offsetY = mousePoint.y - drawState.dragStart!.y;

      for (const line of draggedElement.polygon.lines) {
        line.points[0].x += offsetX;
        line.points[0].y += offsetY;
      }

      drawState.dragStart = mousePoint;
      draggedElement.polygon.highlightAll();
    }

    if (drawState.draggedLine) {
      // Drag one edge
      const offsetX = mousePoint.x - drawState.dragStart!.x;
      const offsetY = mousePoint.y - drawState.dragStart!.y;
      drawState.draggedLine.element.points[0].x += offsetX;
      drawState.draggedLine.element.points[0].y += offsetY;
      drawState.draggedLine.element.points[1].x += offsetX;
      drawState.draggedLine.element.points[1].y += offsetY;
      drawState.draggedLine.element.hover = true;
      drawState.dragStart = mousePoint;
    } else if (drawState.draggedPoint) {
      // Drag one point
      drawState.draggedPoint.element.x = mousePoint.x;
      drawState.draggedPoint.element.y = mousePoint.y;
      drawState.draggedPoint.element.hover = true;
    } else {
      highlight();
    }
  }

  function deleteMode() {
    highlight();
  }

  function splitMode() {
    highlight(true);
  }

  function setLengthMode() {}

  function setPerpendicularMode() {}

  function highlight(edgeOnly: boolean = false) {
    const hoveredElement = findHoveredElement(polygons, mousePoint);
    if (!hoveredElement) return;

    if (edgeOnly) {
      if (hoveredElement.element instanceof Line) {
        hoveredElement.element.hover = true;
        return;
      }
      return;
    }

    if (drawState.isShiftPressed) {
      hoveredElement.polygon.highlightAll();
    } else {
      hoveredElement.element.hover = true;
    }
  }
}
