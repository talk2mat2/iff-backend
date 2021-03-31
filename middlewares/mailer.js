
// const fetch= require('node-fetch')

const nodeMailer = require('nodemailer');
process.env.NODE_ENV !== "production" ? require("dotenv").config() : null;



// exports.welcomemail= async function (email,username) {
  
    
    

//     let transporter = nodeMailer.createTransport({
//         host: "smtp-mail.outlook.com",
//         secureConnection: false,
//         port: 587,
//         tls: {
//             ciphers:'SSLv3'
//             },
//         requireTLS:true,
//         auth: {
//             // sender's account
//             user: 'talk2mat7@outlook.com',
//             pass: 'xxxxxx' // here replace user and password with valid email details
//         }
//     });
//     let mailOptions = {
        
//         // // should be replaced with real recipient's account
//         // to: 'talk2martins2@gmail.com',
//         // subject: "testing",
//         // // req.body.subject,
//         // text:"testing covid19 y"
//         // //  req.body.message
//         from: '"COVID-19 update " <talk2mat7@outlook.com>', // sender address (who sends)
//     to: email, // list of receivers (who receives)
//     subject: `welcome to covid 19 updates app ${username}`, // Subject line
//     text: `welcome to covid 19 updates app ${username}`, // plaintext body
//     html: `<p>hello ${username }<br/>we are pleased to welcome you to this great app<br/> here you can see latest update for the current corona virus deases pandemic,<br/> you can also subscribe foe alerts too </p>`
//     };
//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             return console.log(error);
//         }
//         console.log('Message %s sent: %s', info.messageId, info.response);
//     });
    
//   };    
  
 









exports.sendmail= async function (email,confirmationCode,res) {
  
 console.log(confirmationCode)

    let transporter = nodeMailer.createTransport({
        host: "smtp-mail.outlook.com",
        secureConnection: false,
        port: 587,
        tls: {
            ciphers:'SSLv3'
            },
        requireTLS:true,
        auth: {
            // sender's account
            // user: 'talk2mat7@outlook.com',
            user: 'iff1000@outlook.com',
            pass: 'emeka1000' // here replace user and password with valid email details
        }
    });
    let mailOptions = {
        
        from: '"Iff - Intergrity Family And Friends " <iff1000@outlook.com>', // sender address (who sends)
    to: email, // list of receivers (who receives)
    subject: `Iff - Email Verification`, // Subject line
    // text: `pls verify your email address`, // plaintext body
    html:  `<h1>Iff Email Confirmation</h1> <br/>
    <h2>Hello ${email}</h2>
    <p>Thank you for your interest in <b>IFF- (Intergrity Family And Friends)</b> . Please confirm your email by clicking on the following link
    </p> <a href=${process.env.proxyUrl}/verifyEmail/?token=${confirmationCode}&email=${email}> click here </a>
    <p>or by clicking on this button </p><a href=${process.env.proxyUrl}/verifyEmail/?token=${confirmationCode}&email=${email}> <button  style="color:white;background-color:tomato;">Click here</button><a/>
   you can also follow this linl if the button is didn't work
   ${process.env.proxyUrl}/verifyEmail/?token=${confirmationCode}&email=${email}
    <p> Cheers,</>
<p>Iff - Intergrity Family And Friends</>
    </div>`,
    };
  
     await transporter.sendMail(mailOptions).then(succes=>{
         
        console.log('mail sent')
        return  res.status(202).json({message:`verification mail has been sent to ${email},pls check your email and click the link to verify your email ,also check your spam folder`})
    }).catch(err=>{
      console.log(err)
        return  res.status(501).json({message:`Error occured, Unable to send mail to ${email}`})
     });
   
  };    
  
 





// exports.sendMail=async function (){
// const userdata=  await mailSchema.find({});

// //checks for subscribers before calling the sendmail function
// if(userdata.length>=1){
    
//     for(var i=0;i<userdata.length;i++){
//         const email=userdata[i].email;
    
//         const country= userdata[i].country;
      
// const run =sendmail;
// run(email,country)
//     }
// }else {console.log('not found')}
//}