function notFound (req, res) {
  const httpMethods = ['POST', 'GET', 'PUT', 'DELETE'];
  if (httpMethods.indexOf(req.method) === -1) {
    res.status(405).send({error: 'That action is not supported here.'});
  } else {
    res.status(404).send({error: `${req.method} ${req.url} does not exist`});
  }
};

module.exports = notFound;