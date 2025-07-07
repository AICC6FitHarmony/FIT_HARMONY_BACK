const { sendQuery } = require("../../config/database");

const getGyms = async (req, res)=>{
  try {
    const gyms = await sendQuery(
      `select * from gym order by gym`
    )
    res.json(gyms);
  } catch (error) {
    console.log(error)
    res.json({msg:error, success:false})
  }
}

const createGym = async (req, res) => {
  console.log(req.body);
  const {gym_name, gym_address} = req.body;
  try {
    const gyms = await sendQuery(`
      insert into gym(gym, gym_address) values($1, $2) returning *
      `,[gym_name, gym_address]);
    
    if(gyms.length == 0){
      return res.json({msg:"생성 실패", success:false});
    }
    res.json(gyms[0]);
  } catch (error) {
    console.log("createGyms Error : ",error);
    res.json({msg:error, success:false})
  }
}


module.exports = {getGyms, createGym};
