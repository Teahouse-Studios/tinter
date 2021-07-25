import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
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
  return <div>
    <input placeholder={'昵称'} name={'username'} onChange={handleChange} value={input.username}/>
    <input placeholder={'邮箱'} name={'email'} onChange={handleChange} value={input.email}/>
    <h2>邮箱用于 gravatar, 将会 hash 后传输至其他客户端</h2>
    <button color={'primary'} onClick={save}>保存</button>
    <button color={'primary'} onClick={() => {
      history.push('/room');
    }}>前往房间</button>
  </div>;
};

export default IndexPage;
