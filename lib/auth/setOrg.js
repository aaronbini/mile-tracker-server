//checks token user passes against org token
//temporarily stored as env variable
//TODO: this will need to be hashed and saved as prop of Org in DB
module.exports = function setOrg (token) {
  switch (token) {
  case process.env.EE_TOKEN :
    return 'Equal Exchange';
    break;
  case process.env.TEST_TOKEN :
    return 'Test Organization';
    break;
  case process.env.TEST_TOKEN_TWO :
    return 'Test Organization Two';
  default: 
    return '';
  }
};
