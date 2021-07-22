import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useRef} from 'react'
import {PBData} from "./paintboardControl";

const Paintboard = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
    update(data: PBData) {
      console.log(data)
      if (data.type === "clear") {
        ctx?.clearRect(0, 0, 1280, 720)
        paintingRef.current = false
      } else if (data.type === "edit_mode") {
        erasingRef.current = false
      } else if (data.type === "eraser_mode") {
        erasingRef.current = true
      }
    }
  }))
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  let ctx = useMemo(() => canvasRef.current?.getContext('2d'), [canvasRef.current])
  const paintingRef = useRef(false)
  const erasingRef = useRef(false)
  const lastPointRef = useRef({
    x: 0, y: 0
  })
  const getLocOnCanvas = (clientX: number, clientY: number) => {
    if(!canvasRef.current){
      return [clientX, clientY];
    }
    const style = window.getComputedStyle(canvasRef.current, null)
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      clientX -= rect?.left;
      clientY -= rect?.top;
    }
    clientX *= 1280 / parseFloat(style.width)
    clientY *= 720 / parseFloat(style.height)
    return [clientX, clientY]
  }
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    let newLoc = getLocOnCanvas(e.clientX, e.clientY)
    
    paintingRef.current = true
    lastPointRef.current = {
      x: newLoc[0], y: newLoc[1]
    }
    //console.log(ctx)
    if (ctx) {
      ctx.lineWidth = 3
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (!erasingRef.current) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(lastPointRef.current.x, lastPointRef.current.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.clearRect(lastPointRef.current.x, lastPointRef.current.y, 5, 5)
      }
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    let newLoc = getLocOnCanvas(e.clientX, e.clientY)
    if (paintingRef.current && ctx) {
      //ctx.moveTo(x,y);
      if (!erasingRef.current) {
        ctx.lineTo(newLoc[0], newLoc[1]);
        ctx.stroke();
      } else {
        ctx.clearRect(newLoc[0], newLoc[1], 5, 5)
      }
      lastPointRef.current = {x: newLoc[0], y: newLoc[1]}
    }
  }
  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    paintingRef.current = false
  }
  return <canvas width={"1280"} height={"720"} ref={canvasRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                 onMouseUp={onMouseUp} style={{width: '100%'}}>
  
  </canvas>
})

export default Paintboard;
