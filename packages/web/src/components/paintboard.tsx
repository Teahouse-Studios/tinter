import React, {
  forwardRef, useEffect, useImperativeHandle, useMemo, useRef,
} from 'react';
import {PBData} from './paintboardControl';
import type {DrawEvent} from "../../../server/src/types";
import {Box} from "@material-ui/core";

interface IProps {
  disabled: boolean;
  sockjs?: WebSocket | null
}

const POINT_RADIUS = 1.5
const ERASER_RADIUS = 40;

const Paintboard = forwardRef((props: IProps, ref) => {
  useImperativeHandle(ref, () => ({
    update(data: PBData) {
      if (data.type === 'clear') {
        clear()
        sockjs?.send(JSON.stringify({
          type: "draw",
          subtype: "clear",
          pos: [0, 0]
        }))
        paintingRef.current = false;
      } else if (data.type === 'edit_mode') {
        erasingRef.current = false;
      } else if (data.type === 'eraser_mode') {
        erasingRef.current = true;
      } else if (data.type === 'color') {
        if (ctx) {
          ctx.fillStyle = data.data as string
          ctx.strokeStyle = data.data as string
          colorRef.current = data.data as string
        }
      }
    },
    draw(data: DrawEvent) {
      if (data.color) {
        if (ctx) {
          ctx.fillStyle = data.color
          ctx.strokeStyle = data.color
        }
        colorRef.current = data.color
      }
      if (data.subtype === "point") {
        drawPoint(data.pos[0], data.pos[1])
      } else if (data.subtype === "lineTo") {
        lineTo(data.pos[0], data.pos[1])
      } else if (data.subtype === 'clear') {
        clear()
      } else if (data.subtype === "eraser") {
        eraser(data.pos[0], data.pos[1])
      }
    }
  }));
  const colorRef = useRef('#000000')
  const {disabled, sockjs} = props
  const clear = () => ctx?.clearRect(0, 0, 1280, 720);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let ctx = useMemo(() => canvasRef.current?.getContext('2d'), [canvasRef.current]);
  const paintingRef = useRef(false);
  const erasingRef = useRef(false);
  const lastPointRef = useRef({
    x: 0, y: 0,
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
      ctx.fill()
    }
  }
  const lineTo = (x: number, y: number) => {
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  const eraser = (x: number, y: number) => {
    ctx?.clearRect(x, y, ERASER_RADIUS, ERASER_RADIUS);
  }
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const newLoc = getLocOnCanvas(e.clientX, e.clientY);
    
    paintingRef.current = true;
    lastPointRef.current = {
      x: newLoc[0], y: newLoc[1],
    };
    if (ctx && sockjs) {
      if (!erasingRef.current) {
        drawPoint(lastPointRef.current.x, lastPointRef.current.y)
        sockjs.send(JSON.stringify({
          type: "draw",
          subtype: "point",
          pos: [lastPointRef.current.x, lastPointRef.current.y],
          color: colorRef.current
        }))
      } else {
        sockjs.send(JSON.stringify({
          type: "draw",
          subtype: "eraser",
          pos: [lastPointRef.current.x, lastPointRef.current.y],
          color: colorRef.current
        }))
        eraser(lastPointRef.current.x, lastPointRef.current.y)
      }
    }
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const newLoc = getLocOnCanvas(e.clientX, e.clientY);
    if (paintingRef.current && ctx && sockjs) {
      // ctx.moveTo(x,y);
      if (!erasingRef.current) {
        sockjs.send(JSON.stringify({
          type: "draw",
          subtype: "lineTo",
          pos: [newLoc[0], newLoc[1]],
          color: colorRef.current
        }))
        lineTo(newLoc[0], newLoc[1])
      } else {
        sockjs.send(JSON.stringify({
          type: "draw",
          subtype: "eraser",
          pos: [newLoc[0], newLoc[1]],
          color: colorRef.current
        }))
        eraser(newLoc[0], newLoc[1])
      }
      lastPointRef.current = {x: newLoc[0], y: newLoc[1]};
    }
  };
  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    paintingRef.current = false;
  };
  return <canvas width={'1280'} height={'720'} ref={canvasRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} style={{width: '100%'}}>
    
    </canvas>
});

export default Paintboard;
