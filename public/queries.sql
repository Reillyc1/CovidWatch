SELECT u_id,given_name,family_name,username,email FROM user WHERE username = ? AND password = SHA2(?,256);

INSERT INTO user (u_id,given_name,family_name,username,password,email_address,user_type)
VALUES (1,"Bob","Brice","bobrice_",SHA2("BobTheLegend963",256),"bobrice@example.email","user");


INSERT INTO user (u_id,given_name,family_name,username,password,email_address,user_type)
VALUES (2,"Jenny","Elliot","jen_e11",SHA2("Planet481216!",256),"jennyelliot11@example.email","manager");


INSERT INTO user (u_id,given_name,family_name,username,password,email_address,user_type)
VALUES (3,"George","Snow","snowy123098",SHA2("Sunny000!",256),"georges@example.email","admin");


+------+------------+-------------+-------------+-----------------+-----------------------------+-----------+
| u_id | given_name | family_name | username    | password        | email_address               | user_type |
+------+------------+-------------+-------------+-----------------+-----------------------------+-----------+
|    1 | Bob        | Brice       | bobrice_    | BobTheLegend963 | bobrice@example.email       | user      |
|    2 | Jenny      | Elliot      | jen_e11     | Planet481216!   | jennyelliot11@example.email | manager   |
|    3 | George     | Snow        | snowy123098 | Sunny000!       | georges@example.email       | admin     |
+------+------------+-------------+-------------+-----------------+-----------------------------+-----------+


INSERT INTO check_ins (check_in_code,u_id,date_,time_)
VALUES ("8H8lRa",1,'2020-05-28','13:24:31');


ALTER TABLE check_ins
MODIFY COLUMN check_in_code VARCHAR(6);


+---------------+--------------+------+-----+---------+-------+
| v_id          | int          | NO   | PRI | NULL    |       |
| street_number | int          | YES  |     | NULL    |       |
| street_name   | varchar(50)  | YES  |     | NULL    |       |
| suburb_town   | varchar(128) | YES  |     | NULL    |       |
| state         | varchar(50)  | YES  |     | NULL    |       |
| country       | varchar(128) | YES  |     | NULL    |       |
| check_in_code | int          | YES  |     | NULL    |       |


INSERT INTO venue (v_id,street_number,street_name,suburb_town,state,postcode,country,check_in_code)
VALUES (1,11,"Baking Street","Glenelg","SA",5045,"Australia","8H8lRa");


INSERT INTO user (given_name,family_name,username,password,email_address)
VALUES (?,?,?,PASSWORD(SHA2,?),?);

FROM check_in INNER JOIN user
ON check_in.u_id = user.username
INSERT INTO check_in (check_in_code,date_,time_,u_id)
VALUES (?,?,?,?);

ALTER TABLE check_ins
MODIFY COLUMN check_in_code VARCHAR(6) PRIMARY KEY;

ALTER TABLE check_ins
ADD COLUMN username VARCHAR(50) UNIQUE;


UPDATE check_ins
SET username = "bobrice_"
WHERE check_in_code = "P8h73i";


SELECT * FROM check_ins
INNER JOIN user
WHERE check_ins.username = user.username;