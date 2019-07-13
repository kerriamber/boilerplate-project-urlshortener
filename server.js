require( 'dotenv' ).config();

const express = require( 'express' );
const dns = require( 'dns' );
const cors = require( 'cors' );
const app = express();
const Sequelize = require( 'sequelize' );
const bodyparser = require( 'body-parser' );

const sequelize = new Sequelize( process.env.DB_SCHEMA, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: 'localhost',
  dialect: 'mysql'
} );

const Url = sequelize.define( 'url', {
  url: {
    type: Sequelize.STRING,
  },
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
} );

Url.sync();


// Basic Configuration 
const port = process.env.PORT || 3000;

app.use( cors() );

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use( bodyparser.urlencoded() );
app.use( bodyparser.json() );

app.use( '/public', express.static( process.cwd() + '/public' ) );

app.get( '/', function ( req, res ) {
  res.sendFile( process.cwd() + '/views/index.html' );
} );

app.post( '/api/shorturl/new', ( req, res ) => {
  let url;
  try {
    url = new URL( req.body.url );
    dns.lookup( url.hostname, ( err, addr ) => {
      if ( err ) {
        console.error( err );
        res.json( {
          error: "URL does not have a DNS entry"
        } )
      } else {
        Url.create( { url: url.toString() } ).then( created => {
          res.json( {
            original_url: url,
            short_url: created.id
          } );
        } );
      }
    } );
  } catch ( e ) {
    if ( e instanceof TypeError ) {
      res.json( {
        error: "Invalid URL"
      } );
    }
  }
} );

app.get( '/api/shorturl/:id', ( req, res ) => {
  let id = parseInt( req.params.id );
  if ( isNaN( id ) ) {
    res.json( {
      error: 'invalid shorturl id'
    } );
    return;
  }

  Url.findOne( {
    where: {
      id: id
    }
  } ).then( url => {
    if ( !url ) {
      res.json( {
        error: 'shorturl id does not exist'
      } );
      return;
    }
    res.set( 'Location', url.url );
    res.status( 301 );
    res.send();
  } )
} );


app.listen( port, function () {
  console.log( 'Node.js listening ..' );
} );