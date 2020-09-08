const routes = route => {
    route.get('/', (req, res) => {
        res.send(`API server in running - (${new Date()})`);
    });
};

export default routes;
