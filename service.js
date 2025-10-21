const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { ObjectId } = require("mongodb");


module.exports = function (users,SECRET_KEY){
const router = express.Router()

    // ===== Регистрация =====
router.post('/register',async(req,res)=>{
  
  const {username ,password ,city} = req.body

    if(!username || !password || !city){
    return res.status(400).json({error: 'Заполните все поля'})   
    }

    const existingUser = await users.findOne({username})
      if(existingUser){
          return res.status(400).json({error: 'Пользователь уже существует'})
      }

      const hash = await bcrypt.hash(password,10)
  
    try{
    await users.insertOne({username, city, password: hash})
    res.json({ message: 'Регистрация успешна' });
   }catch{
     console.error("Ошибка при регистрации пользователя:", error)
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
   }
})

      // ===== Авторизация =====
router.post('/login',async(req,res)=>{
    try{
        const {username,password} = req.body;
        
        const user = await users.findOne({username})
        if(!user){
            return res.status(400).json({error: "Пользователь не найден"})
        }
        const mathed = await bcrypt.compare(password,user.password)
        if(!mathed){
            return res.status(400).json({ error: "Неверный пароль" })
        }

          const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: "1h" })
        res.json({ message: "✅ Успешный вход", token })

    }catch{(error)
    res.status(500).json({ error: "Ошибка авторизации" })
    }
})

// ===== Профиль (по токену) =====
router.get("/profile", async (req, res) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ error: "Нет токена" })

  jwt.verify(token, SECRET_KEY, (err, payload) => {
    if (err) return res.status(403).json({ error: "Неверный токен" })
    res.json({ message: `Добро пожаловать, ${payload.username}` })
  })
})

  // ===== Получить пользователя по ID =====
router.get('/user/:id',async(req,res)=>{
  try{
    const {id} = req.params;

    if(!ObjectId.isValid(id)){
      return res.status(400).json({ error: "Некорректный ID" });
    }

    const user = await users.findOne
    ({_id: new ObjectId(id)},
    {projection: {password: 0}})

    if(!user){
       return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json(user)
  }catch(err){
  res.status(500).json({ error: "Ошибка поиска пользователя" });
  }
})

  // 4. Фильтрация (req.query)
router.get('/users',async(req,res)=>{
  try{
    const {city} = req.query;

    let query = {}
    if(city) query.city = city;
    
   const allUsers =  await users.find(query).toArray() 
    
   const safeUsers = allUsers.map(user => ({
    username: user.username,
    city: user.city
   }))
   res.json(safeUsers)

  }catch(err){
    return res.status(500).json({error: 'Ошибка сервера'})
  }
})


    // 5. Смена пороля аккаунта
router.post('/change-password',async(req,res)=>{
  const {username, oldPassword, newPassword} = req.body;

   if(!username || !oldPassword || !newPassword){
   return res.status(400).json({ error: 'Введите логин, старый и новый пароль' })
   }

   const user = await users.findOne({username})
     if(!user){
     return res.status(400).json({ error: 'Пользователь не найден' })
    }
    const matched = await bcrypt.compare(oldPassword, user.password)

    if(!matched){
     return res.status(400).json({ error: 'Старый пароль неверный' })
  }
  const newHash = await bcrypt.hash(newPassword,10);
  await users.updateOne({username},{$set:{password: newHash}})
  res.json({ message: 'Пароль успешно изменен' })
})



  // 6. Удаление аккаунта
router.post('/delete-account',async(req,res)=>{
  const {username, password} = req.body

    try{
      if(!username || !password){
      return res.status(400).json({error: "Заполните поле"})
    }
    
    const user = await users.findOne({username})
    if(!user){
     return res.status(400).json({error: "Пользователь не найден"})
    }

    const matched = await bcrypt.compare(password, user.password)
    if(!matched){
      return  res.status(400).json({error: "Пароль неверный"})
    }
    await users.deleteOne({username});
    res.json({message: 'Аккаунт успешно удалён'});
    }catch{
      return res.status(500).json({error: 'Ошибка сервера'});
    }
})


return router}