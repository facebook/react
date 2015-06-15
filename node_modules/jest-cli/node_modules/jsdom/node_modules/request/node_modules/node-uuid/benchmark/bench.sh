#!/bin/bash

# for a given node version run:
# for i in {0..9}; do node benchmark.js >> bench_0.6.2.log; done;

PATTERNS=('nodeuuid.v1()' "nodeuuid.v1('binary'," 'nodeuuid.v4()' "nodeuuid.v4('binary'," "uuid()" "uuid('binary')" 'uuidjs.create(1)' 'uuidjs.create(4)' '140byte')
FILES=(node_uuid_v1_string node_uuid_v1_buf node_uuid_v4_string node_uuid_v4_buf libuuid_v4_string libuuid_v4_binary uuidjs_v1_string uuidjs_v4_string 140byte_es)
INDICES=(2 3 2 3 2 2 2 2 2)
VERSIONS=$( ls bench_*.log | sed -e 's/^bench_\([0-9\.]*\)\.log/\1/' | tr "\\n" " " )
TMPJOIN="tmp_join"
OUTPUT="bench_results.txt"

for I in ${!FILES[*]}; do
  F=${FILES[$I]}
  P=${PATTERNS[$I]}
  INDEX=${INDICES[$I]}
  echo "version $F" > $F
  for V in $VERSIONS; do
    (VAL=$( grep "$P" bench_$V.log | LC_ALL=en_US awk '{ sum += $'$INDEX' } END { print sum/NR }' ); echo $V $VAL) >> $F
  done
  if [ $I == 0 ]; then
    cat $F > $TMPJOIN
  else
    join $TMPJOIN $F > $OUTPUT
    cp $OUTPUT $TMPJOIN
  fi
  rm $F
done

rm $TMPJOIN

gnuplot bench.gnu
convert -density 200 -resize 800x560 -flatten bench.eps bench.png
rm bench.eps
