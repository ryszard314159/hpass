#!/bin/bash

function usage() {
    special='#$%&\()*+,-./:;<=>?@[\\]^_`{|}~'
    echo
    echo "Usage example:"
    echo
    echo "./customize.sh --sekret SEKRET --prefix PREFIX --length 8 --burnin 9 < template.html > demo.html"
    echo
    echo SEKRET - can be any string
    echo "PREFIX - use one (or more) from ${special} to satisfy picky sites"
    echo "LENGTH - length (4-64) of the password to generate"
    echo
}

POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      usage; exit 0;
      shift
      ;;
    -k|--sekret)
      SEKRET="$2"
      shift # past argument
      shift # past value
      ;;
    -x|--prefix)
      PREFIX="$2"
      shift # past argument
      shift # past value
      ;;
    -L|--length)
      LENGTH="$2"
      shift # past argument
      shift # past value
      ;;
    -b|--burnin)
      BURNIN="$2"
      shift # past argument
      shift # past value
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
          *)
    POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done

# sekret=$1
# prefix=$2
# length=$3
# echo sekret= $SEKRET, prefix=$PREFIX, length=$LENGTH
sed -e '/Password Generator/d' \
  -e '/<label>Sekret:<\/label>/d' -e '/<input id="sekret"/d' -e "s/args.sekret = .*$/args.sekret = '${SEKRET}'/" \
  -e '/<label>Prefix:<\/label>/d' -e '/<input id="prefix"/d' -e "s/args.prefix = .*$/args.prefix = '${PREFIX}'/" \
  -e '/<label>Length:<\/label>/d' -e '/<input id="length"/d' -e "s/args.length = .*$/args.length = ${LENGTH}/" \
  -e '/<label>Burnin:<\/label>/d' -e '/<input id="burnin"/d' -e "s/args.burnin = .*$/args.burnin = ${BURNIN}/" \
  -e '/<hr style/d' -e '/passwords/d'
