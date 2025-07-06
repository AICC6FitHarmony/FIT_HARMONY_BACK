const { sendQuery } = require("../../config/database");

const getGyms = async (req, res)=>{
  try {
    const gyms = await sendQuery(
      `select * from gym`
    )
    res.json(gyms);
  } catch (error) {
    console.log(error)
    res.json({msg:error, success:false})
  }
}

const createGyms = async (req, res) => {
  // const {gym, gym_address}
  try {
    const gyms = await sendQuery(`
      insert into gym(gym, gym_address) values(1$,2$)
      `,[]);
  } catch (error) {
    console.log("createGyms Error : ",error);
    res.json({msg:error, success:false})
  }
}


module.exports = {getGyms};
