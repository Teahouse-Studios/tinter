import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box, Button, Container, Input, Stack, Text,
} from '@chakra-ui/react';
const IndexPage = () => {
  const history = useHistory();
  const [input, setInput] = useState({
    username: '',
    email: '',
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    const data = localStorage.getItem('user');
    if (data) {
      try {
        const a = JSON.parse(data);
        setInput(a);
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);
  const save = () => {
    localStorage.setItem('user', JSON.stringify(input));
    alert('保存成功');
  };
  return <Container>
    <Input placeholder={'昵称'} name={'username'} onChange={handleChange} value={input.username}/>
    <Box mt={2}>
      <Input placeholder={'邮箱'} name={'email'} onChange={handleChange} value={input.email}/>
    </Box>
    <Text fontSize="xl">邮箱用于 gravatar, 将会 hash 后传输至其他客户端</Text>
    <Stack spacing={4} direction={'row'} align={'center'}>
      <Button colorScheme="blue" onClick={save}>保存</Button>
      <Button onClick={() => {
        history.push('/room');
      }}>前往房间</Button>
    </Stack>
  </Container>;
};

export default IndexPage;
