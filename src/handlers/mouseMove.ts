import Line from '../class/Line';
import Point from '../class/Point';
import Polygon from '../class/Polygon';
import RestrictionData from '../class/RestrictionData';
import { DrawState, EditorMode, PolygonWith } from '../types';
import { canClosePolygon, findHoveredElement } from '../utils';

export default function mouseMove(
  editorMode: EditorMode,
  mousePoint: Point,
  drawState: DrawState,
  polygons: Polygon[],
  restrictionData: RestrictionData,
  setErrorText: (text: string) => void,
  lengthRestrictionLine: PolygonWith<Line> | undefined
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
    case EditorMode.SetBezier:
      setBezier();
      break;
  }

  function addMode() {
    if (!drawState.drawingStart) return;
    drawState.drawingLine!.setEnd(mousePoint);
    if (canClosePolygon(drawState))
      drawState.polygonStart?.isAt(mousePoint, true);
  }

  function moveMode() {
    if (drawState.draggedBezierPoint) {
      let offsetX = mousePoint.x - drawState.dragStart!.x;
      let offsetY = mousePoint.y - drawState.dragStart!.y;
      if (drawState.draggedBezierPoint.negative) {
        offsetX *= -1;
        offsetY *= -1;
      }
      drawState.draggedBezierPoint.x += offsetX;
      drawState.draggedBezierPoint.y += offsetY;
      drawState.dragStart = mousePoint;
      return;
    }

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

      const error = Polygon.applyRestrictions(
        polygons,
        restrictionData,
        drawState.draggedLine.polygon,
        [drawState.draggedLine.element]
      );

      if (error) {
        setErrorText(
          'Znaleziono sprzeczne ograniczenia - spróbuj usunąć niektóre ograniczenia'
        );
      }
    } else if (drawState.draggedPoint) {
      // Drag one point
      drawState.draggedPoint.element.x = mousePoint.x;
      drawState.draggedPoint.element.y = mousePoint.y;
      drawState.draggedPoint.element.hover = true;

      const error = Polygon.applyRestrictions(
        polygons,
        restrictionData,
        drawState.draggedPoint.polygon,
        [
          drawState.draggedPoint.polygon.lines.find(
            (line) => line.points[0] === drawState.draggedPoint?.element
          )!,
          drawState.draggedPoint.polygon.lines.find(
            (line) => line.points[1] === drawState.draggedPoint?.element
          )!,
        ]
      );

      if (error) {
        setErrorText(
          'Znaleziono sprzeczne ograniczenia - spróbuj usunąć niektóre ograniczenia'
        );
      }
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

  function setLengthMode() {
    if (lengthRestrictionLine) {
      lengthRestrictionLine.element.hover = true;
    } else {
      highlight(true);
    }
  }

  function setPerpendicularMode() {
    highlight(true);

    if (drawState.restrictionFirstLine) {
      drawState.restrictionFirstLine.element.hover = true;
    }
  }

  function setBezier() {
    highlight(true);
  }

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
