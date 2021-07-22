import React from 'react';
import { IconButton } from '@material-ui/core';
import { Clear, Edit } from '@material-ui/icons';
import { Eraser } from 'mdi-material-ui';

export interface PBData {
  type: 'clear' | 'edit_mode' | 'eraser_mode'
}

interface IProps {
  callback: (data: PBData) => any
}

const PaintboardControl: React.FunctionComponent<IProps> = ({ callback }) => <div>
  <IconButton onClick={() => callback({ type: 'edit_mode' })}>
    <Edit/>
  </IconButton>
  <IconButton onClick={() => callback({ type: 'eraser_mode' })}>
    <Eraser />
  </IconButton>
  <IconButton onClick={() => callback({ type: 'clear' })}>
    <Clear />
  </IconButton>
</div>;

export default PaintboardControl;
