/*
Test performance of native C UUID generation

To Compile: cc -luuid benchmark-native.c -o benchmark-native
*/

#include <stdio.h>
#include <unistd.h>
#include <sys/time.h>
#include <uuid/uuid.h>

int main() {
  uuid_t myid;
  char buf[36+1];
  int i;
  struct timeval t;
  double start, finish;

  gettimeofday(&t, NULL);
  start = t.tv_sec + t.tv_usec/1e6;

  int n = 2e5;
  for (i = 0; i < n; i++) {
    uuid_generate(myid);
    uuid_unparse(myid, buf);
  }

  gettimeofday(&t, NULL);
  finish = t.tv_sec + t.tv_usec/1e6;
  double dur = finish - start;

  printf("%d uuids/sec", (int)(n/dur));
  return 0;
}
