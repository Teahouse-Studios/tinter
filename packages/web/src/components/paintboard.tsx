import React, {
  forwardRef, useImperativeHandle, useMemo, useRef,
} from 'react';
import { PBData } from './paintboardControl';
import type { DrawEvent } from '../../../server/src/types';

interface IProps {
  disabled: boolean;
  sockjs?: WebSocket | null
}

const POINT_RADIUS = 1.5;
const ERASER_RADIUS = 40;

const Paintboard = forwardRef((props: IProps, ref) => {
  const colorRef = useRef('#000000');
  const {
    disabled,
    sockjs,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctx = useMemo(() => canvasRef.current?.getContext('2d'), [canvasRef.current]);

  const clear = () => ctx?.clearRect(0, 0, 1280, 720);
  const paintingRef = useRef(false);
  const erasingRef = useRef(false);
  const lastPointRef = useRef({
    x: 0,
    y: 0,
  });
  const getLocOnCanvas = (clientX: number, clientY: number) => {
    if (!canvasRef.current) {
      return [clientX, clientY];
    }
    const style = window.getComputedStyle(canvasRef.current, null);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      clientX -= rect?.left;
      clientY -= rect?.top;
    }
    clientX *= 1280 / parseFloat(style.width);
    clientY *= 720 / parseFloat(style.height);
    return [clientX, clientY];
  };
  const drawPoint = (x: number, y: number) => {
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const lineTo = (x: number, y: number) => {
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };
  const eraser = (x: number, y: number) => {
    ctx?.clearRect(x, y, ERASER_RADIUS, ERASER_RADIUS);
  };
  useImperativeHandle(ref, () => ({
    update(data: PBData) {
      if (data.type === 'clear') {
        clear();
        sockjs?.send(JSON.stringify({
          type: 'draw',
          subtype: 'clear',
          pos: [0, 0],
        }));
        paintingRef.current = false;
      } else if (data.type === 'edit_mode') {
        erasingRef.current = false;
      } else if (data.type === 'eraser_mode') {
        erasingRef.current = true;
      } else if (data.type === 'color') {
        if (ctx) {
          ctx.fillStyle = data.data as string;
          ctx.strokeStyle = data.data as string;
          colorRef.current = data.data as string;
        }
      } else if (data.type === 'skip') {
        sockjs?.send(JSON.stringify({
          type: 'skip',
        }));
      }
    },
    draw(data: DrawEvent) {
      if (data.color) {
        if (ctx) {
          ctx.fillStyle = data.color;
          ctx.strokeStyle = data.color;
        }
        colorRef.current = data.color;
      }
      if (data.subtype === 'point') {
        drawPoint(data.pos[0], data.pos[1]);
      } else if (data.subtype === 'lineTo') {
        lineTo(data.pos[0], data.pos[1]);
      } else if (data.subtype === 'clear') {
        clear();
      } else if (data.subtype === 'eraser') {
        eraser(data.pos[0], data.pos[1]);
      }
    },
  }));
  const onPaint = (x: number, y: number) => {
    paintingRef.current = true;
    lastPointRef.current = { x, y };
    if (ctx && sockjs) {
      if (!erasingRef.current) {
        drawPoint(lastPointRef.current.x, lastPointRef.current.y);
        sockjs.send(JSON.stringify({
          type: 'draw',
          subtype: 'point',
          pos: [lastPointRef.current.x, lastPointRef.current.y],
          color: colorRef.current,
        }));
      } else {
        sockjs.send(JSON.stringify({
          type: 'draw',
          subtype: 'eraser',
          pos: [lastPointRef.current.x, lastPointRef.current.y],
          color: colorRef.current,
        }));
        eraser(lastPointRef.current.x, lastPointRef.current.y);
      }
    }
  };
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const newLoc = getLocOnCanvas(e.clientX, e.clientY);
    onPaint(newLoc[0], newLoc[1]);
  };
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const x = e.touches[0].clientX; const
      y = e.touches[0].clientY;
    const newLoc = getLocOnCanvas(x, y);
    onPaint(newLoc[0], newLoc[1]);
  };
  const onMove = (newLoc: ReturnType<typeof getLocOnCanvas>) => {
    if (paintingRef.current && ctx && sockjs) {
      // ctx.moveTo(x,y);
      if (!erasingRef.current) {
        sockjs.send(JSON.stringify({
          type: 'draw',
          subtype: 'lineTo',
          pos: [newLoc[0], newLoc[1]],
          color: colorRef.current,
        }));
        lineTo(newLoc[0], newLoc[1]);
      } else {
        sockjs.send(JSON.stringify({
          type: 'draw',
          subtype: 'eraser',
          pos: [newLoc[0], newLoc[1]],
          color: colorRef.current,
        }));
        eraser(newLoc[0], newLoc[1]);
      }
      lastPointRef.current = {
        x: newLoc[0],
        y: newLoc[1],
      };
    }
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const newLoc = getLocOnCanvas(e.clientX, e.clientY);
    onMove(newLoc);
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const newLoc = getLocOnCanvas(e.touches[0].clientX, e.touches[0].clientY);
    onMove(newLoc);
  };
  const onMouseUp = () => {
    paintingRef.current = false;
  };
  return <canvas
    width={'1280'} height={'720'}
    ref={canvasRef} style={{ width: '100%' }}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseOut={onMouseUp}
    onMouseUp={onMouseUp}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onMouseUp}>
  </canvas>;
});

export default Paintboard;
