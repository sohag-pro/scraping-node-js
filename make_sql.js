const fs = require("fs");


(async() => {
    var details = JSON.parse(fs.readFileSync(`company/ga-nv_details.json`, 'utf8'));
    console.log("Total Count: " + details.length)

    var sql = ''
    for (x in details) {
        var company = details[x]
        var description = company.description.replace(/"/g, '\\"')
        var name = company.name.replace(/"/g, '\\"')

        sql += `INSERT INTO e_providers(name, e_provider_type_id, description, phone_number, availability_range, available, featured, accepted) VALUES ("{\\"en\\":\\"${name}\\"}",2,"${description}","${company.phone}",5,0,0,0);
`
    }

    fs.writeFile(`mysql/ga-nv_details.sql`, sql,
        function(err) {
            if (err) {
                console.log(err);
            }
            console.log('file saved')
        });

    console.log('exited')
})();