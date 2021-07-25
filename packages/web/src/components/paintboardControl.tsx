import React, { useEffect, useState } from 'react';
import {
  Box, Stack, useRadio, useRadioGroup,
} from '@chakra-ui/react';
import {
  Clear, Edit, RemoveCircle, SkipNext,
} from '@material-ui/icons';
export interface PBData {
  type: 'clear' | 'edit_mode' | 'eraser_mode' | 'color' | 'skip'
  data?: string
}

interface IProps {
  drawing: string
  callback: (data: PBData) => any
}

function RadioCard(props) {
  const { getInputProps, getCheckboxProps } = useRadio(props);
  const input = getInputProps();
  const checkbox = getCheckboxProps();
  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderRadius="md"
        boxShadow="md"
        _checked={{
          bg: 'teal.600',
          color: 'white',
          borderColor: 'teal.600',
        }}
        _focus={{
          boxShadow: 'outline',
        }}
        px={2}
        py={1}
      >
        {props.children}
      </Box>
    </Box>
  );
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
  const options: [string, any][] = [
    ['edit_mode', <Edit />],
    ['eraser_mode', <RemoveCircle />],
    ['clear', <Clear />],
    ['skip', <SkipNext />],
  ];
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'mode',
    defaultValue: 'edit_mode',
    onChange: (s) => callback({ type: s as any }),
  });
  const group = getRootProps();
  return <div>
    {drawing}
    <br />
    <Stack {...group} spacing={2} direction={'row'} align={'center'}>
      {options.map(([value, icon]) => {
        const radio = getRadioProps({ value });
        return <RadioCard key={value} {...radio}>{icon}</RadioCard>;
      })}
    </Stack>
    <br />
    <input type={'color'} className="colorSelect" onChange={(e) => setColor(e.target.value)} value={color} />
    {colors.map((v) => (
      <div style={{ backgroundColor: v }} className="colorButton" onClick={() => setColor(v)} />
    ))}
  </div>;
};

export default PaintboardControl;
