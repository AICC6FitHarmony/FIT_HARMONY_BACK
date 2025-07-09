const { sendQuery } = require('../../config/database'); 


const getBoardInfo = async(req, res)=>{
  const {boardId} = req.params;
  const query = `select * from post_category where category_id = $1`;
  const values = [boardId];
  try {
    const result = await sendQuery(query,values);
    if(result.length === 0){
      res?.json({success: false});
      return {success: false}; 
    }
    res?.json({data:{info:result[0]}, success: true});
    return {data:{info:result[0]}, success: true};
  } catch (error) {
    console.log(error);
    res?.json({success: false});
    return {success: false};
  }
}

const getBoards = async(req, res)=>{
  const query = `select * from post_category order by category_name`;
  try {
    const result = await sendQuery(query);

    if(result.length === 0){
      res?.json({success: false});
      return {success: false}; 
    }
    res?.json({data:{boards:result}, success: true});
    return {data:{boards:result}, success: true};
  } catch (error) {
    console.log(error);
    res?.json({success: false});
    return {success: false};
  }
}
const getPermissions = async(req, res)=>{
  const {boardId} = req.params;
  const query = `select * from post_category_permission where board_id = $1`;
  const values = [boardId];
  try {
    res?.json({permission:result, success:true});
    return {permission:result, success:true};
  } catch (error) {
    console.log(error);
    res?.json({success:false});
    return {success:false};
  }
}

const getPermission = async(req, res)=>{
  const {} = req.params;
  const {role, permission, boardId} = req.query;
  console.log(req.query)
  const query = `select 1 from post_category_permission 
                where category_id = $1 and role = $2 and permission = $3`;
  const values = [boardId,role,permission];
  
  try {
    const result = await sendQuery(query, values);
    if (result.length > 0){
      res?.json({permission:true, success:true});
      return true;
    }else{
      res?.json({permission:false, success:true});
      return false;
    }
  } catch (error) {
    console.log(error);
    res?.json({success:false});
    return false;
  }
}

const getWriteableBoard = async (req,res)=>{
  
}

module.exports = {getBoardInfo,getBoards, getPermission, getPermissions};