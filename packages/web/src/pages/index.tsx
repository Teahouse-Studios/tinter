import React, {useEffect, useState} from 'react'
import {Button, Container, TextField, Typography,Box} from "@material-ui/core";
import {useHistory} from 'react-router-dom'
const IndexPage = () => {
  const history = useHistory()
  const [input, setInput] = useState({
    username: '',
    email: ''
  })
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput({...input, [e.target.name]: e.target.value})
  }
  useEffect(() => {
    let data = localStorage.getItem("user")
    if(data){
      try{
        let a = JSON.parse(data)
        setInput(a)
      }catch(e){
        localStorage.clear()
      }
    }
  }, [])
  const save = () => {
    localStorage.setItem("user", JSON.stringify(input))
    alert('保存成功')
  }
  return <Container>
    <TextField label={"昵称"} variant={"outlined"} fullWidth name={"username"} onChange={handleChange} value={input.username}/>
    <Box mt={2}>
      <TextField label={"邮箱"} variant={"outlined"} fullWidth name={"email"} onChange={handleChange} value={input.email}/>
    </Box>
    <Typography>邮箱用于 gravatar, 将会 hash 后传输至其他客户端</Typography>
    <Button color={"primary"} variant={"contained"} disableElevation onClick={save}>保存</Button>
    <Button color={"primary"} variant={"outlined"} onClick={() => {
    history.push('/room')}
    }>前往房间</Button>
  </Container>
}

export default IndexPage
