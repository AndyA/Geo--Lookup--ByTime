use strict;
use warnings;
use ExtUtils::MakeMaker;

WriteMakefile(
  ( MM->can( 'signature_target' ) ? ( SIGN => 1 ) : () ),
  license( 'perl' ),
  NAME          => 'Geo::Lookup::ByTime',
  AUTHOR        => 'Andy Armstrong <andy@hexten.net>',
  VERSION_FROM  => 'lib/Geo/Lookup/ByTime.pm',
  ABSTRACT_FROM => 'lib/Geo/Lookup/ByTime.pm',
  PL_FILES      => {},
  PREREQ_PM     => { 'Test::More' => 0, },
  dist          => { COMPRESS => 'gzip -9f', SUFFIX => 'gz', },
  clean => { FILES => 'Geo-Lookup-ByTime-*' },
);

sub license {
  my $lic = shift;
  local $^W = 0;    # Silence warning about non-numeric version
  return
   unless $ExtUtils::MakeMaker::VERSION >= '6.31';
  return ( LICENSE => $lic );
}
