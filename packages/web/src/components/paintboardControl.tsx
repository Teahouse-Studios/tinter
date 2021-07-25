import React, { useEffect, useState } from 'react';
import { Button } from '@blueprintjs/core';

export interface PBData {
  type: 'clear' | 'edit_mode' | 'eraser_mode' | 'color'
  data?: string
}

interface IProps {
  drawing: string
  callback: (data: PBData) => any
}

const colors = ['#000000', '#666666', '#0017f6', '#ffffff', '#aaaaaa',
  '#26c9ff', '#008d26', '#a9230c', '#964112', '#00ff4d', '#ff0013',
  '#ff7829', '#b0701c', '#99004e', '#936867', '#ffc926', '#ff008f',
  '#feafa8', '#00d9a3', '#85b200', '#8000ff', '#052c6c', '#b973ff', '#fff73f'];
const PaintboardControl: React.FunctionComponent<IProps> = ({ drawing, callback }) => {
  const [color, setColor] = useState('#000000');
  useEffect(() => {
    callback({
      type: 'color',
      data: color,
    });
  }, [color]);
  return <div>
    {drawing}
    <br />
    <Button onClick={() => callback({ type: 'edit_mode' })} icon="edit" />
    <Button onClick={() => callback({ type: 'eraser_mode' })} icon="eraser" />
    <Button onClick={() => callback({ type: 'clear' })} icon="clean" />
    <br />
    <input type={'color'} className="colorSelect" onChange={(e) => setColor(e.target.value)} value={color} />
    {colors.map((v) => (
      <div style={{ backgroundColor: v }} className="colorButton" onClick={() => setColor(v)} />
    ))}
  </div>;
};

export default PaintboardControl;
