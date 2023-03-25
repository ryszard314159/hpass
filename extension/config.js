const default_opts = {
  salt: "salt",
  pepper: "@",
  length: 15,
  burnin: 9,
  email: "email",
  username: "username",
};
const maxlength = 64;
const minlength = 5;
const maxburnin = 9999;

const optsKeys = Object.keys(default_opts);

function getHint(domain) {
  return domain.split(".").slice(-2, -1)[0]; // "www.netflix.com" => "netflix"
}

export { getHint, default_opts, optsKeys, minlength, maxlength, maxburnin };
