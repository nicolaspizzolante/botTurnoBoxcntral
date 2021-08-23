const puppeteer = require('puppeteer');
const { CronJob } = require('cron');
require('dotenv').config();

(async () => {
    const horario = "19:00";
    const email = process.env.email;
    const pass = process.env.pass;

    const minuteCron = new CronJob('* * * * *', async () => {
        let date = new Date();

        if (date.getHours() == 0 && date.getMinutes() == 1) {

            let browser = await puppeteer.launch({
                headless: false 
            });
                
            let page = await browser.newPage();
            await page.goto('https://boxcntral.turnosweb.com/', { waitUntil: 'networkidle0' });

            let result = await page.evaluate((horario, email, pass) => {
                return new Promise(async (res) => {
                    function book(){
                        let filas = Array
                            .from(document.querySelectorAll('tr'))
                            .filter(el => el.textContent.includes(horario) && el.textContent.includes("Funcional"));
        
                        // si encontré mas de una boton me quedo con el boton "reservar" de la ultima
                        let boton = filas.length > 1 ? filas[filas.length - 1].querySelector("button") : filas[0].querySelector("button");

                        if (boton) {
                            boton.click();

                            setTimeout(() => {
                                document.querySelector('#btnreservar').click();
                                
                                setTimeout(() => {
                                    if (document.querySelector('h2#swal2-title')) {
                                        res(document.querySelector('h2#swal2-title').textContent + ` a las ${horario}`);
                                    } else if (document.querySelector('h3.text-success')) {
                                        res(document.querySelector('h3.text-success').textContent + ` a las ${horario}`);
                                    } else {
                                        res("Sin resultado");
                                    }
                                }, 1500);

                            }, 1000)

                        } else {
                            res("No se encontro el boton de reserva");
                        }    
                    }

                    // click para desplegar el form de login
                    document.querySelector("#userlogin").click();
            
                    // espero 3 segundos y hago el login
                    setTimeout(() => {
                        document.querySelector("#formlogin .modal-body .form-group input[type='email']").value = email;
                        document.querySelector("#formlogin .modal-body .form-group input[type='password']").value = pass;
                        document.querySelector("#formloginbtn").click();
            
                        // espero 1,5 segundos luego de hacer el login para reservar
                        setTimeout(() => {

                            if (document.querySelector('.btnmore')){
                                document.querySelector('.btnmore').click();

                                setTimeout(() =>{
                                    console.log("llegue");
                                    book();
                                }, 2000);
                            } else {
                                book();
                            }

                        }, 1500);
                    }, 2000);
                });
            }, horario, email, pass);
        
            console.log(result);
        
            browser.close();
        }
    });
    
    minuteCron.start();
})();