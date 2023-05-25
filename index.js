const express = require('express');
const fetch = require('node-fetch');
const axios = require('axios');
const cookieParser = require('cookie-parser');

const server = express();

// Configurando los cookies

server.use(cookieParser());

server.get('/', (req, res) => {
    res.status(200).redirect('https://dev-44166474.okta.com/oauth2/default/v1/authorize?scope=openid%20email%20profile&response_type=code&state=app_state&client_id=0oa9hljre7MiuHcmu5d7&redirect_uri=http://localhost:8080/authorization-code/callback');
});

server.get('/authorization-code/callback', async (req, res) => {
    const {code, state} = req.query;

    // IMPRESION DE LOS PARAMETROS

    console.log('code: ', code);
    console.log('state: ', state);
    
    try {
        const clientId = '0oa9hljre7MiuHcmu5d7';
        const clientSecret = 'wzyqAxPWg9DfyNiw7JUvIop9EpZQ-BZ_6PqdwRI1';

        const data = new URLSearchParams();
        data.append('grant_type', 'authorization_code');
        data.append('code', code);
        data.append('redirect_uri', 'http://localhost:8080/authorization-code/callback');

        const response = await fetch('https://dev-44166474.okta.com/oauth2/default/v1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            body: data
        });

        // OBTENEMOS EL TOKEN DEL USUARIO LOGEADO
        const json = await response.json();
        console.log('token usuario: ' + json.access_token);

        // GUARDAMOS EL TOKEN OBTENIDO Y ACCEDEMOS A TRAVES DE LA URL A LOS DATOS DEL USUARIO
        const token = json.access_token;
        const config = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
        };
        const user_data = await axios.get('https://dev-44166474.okta.com/oauth2/default/v1/userinfo', config)
        console.log('user_data: ', user_data.data);
        
        // Guardamos el valor del token en una cookie
        res.cookie('token', token, {httpOnly: true});

        // Obtenemos el valor de la cookie para probar su funcionamiento
        const tokenCookie = req.cookies['token'];
        console.log('tokenCookie: ', tokenCookie);

        res.status(200).json(user_data.data);
    } catch (error) {
        res.status(404).json(error);
    }
});

server.get('/recommendation/:name', async (req,res) => {
    const {name} = req.params;
    try {
        console.log(name);
        const query1 = await axios.get(`https://nominatim.openstreetmap.org/search.php?q=${name}&format=json`);
        const location = query1.data;
        const [first] = location;
        const url = `http://localhost:3000/nloc/${first.lat}/${first.lon}`;
        const query2 = await axios.get(url);
        const restaurants =  query2.data.restaurants;
        console.log(restaurants)
        const query3 = await axios(`https://api.open-meteo.com/v1/forecast?latitude=${first.lat}&longitude=${first.lon}&forecast_days=2&daily=temperature_2m_max&timezone=PST`)
        const clima = query3.data.daily;
        console.log(clima);
        res.status(200).json({restaurantes: restaurants, clima: clima});
    } catch (error) {
        console.log(error)
    }
})

server.listen(8080, () => {
    console.log('Server started on port 8080');
});