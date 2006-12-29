use strict;
use warnings;
use Module::Build;

my $builder = Module::Build->new(
    module_name         => 'Geo::Lookup::ByTime',
    sign                => 1,
    license             => 'perl',
    dist_author         => 'Andy Armstrong <andy@hexten.net>',
    dist_version_from   => 'lib/Geo/Lookup/ByTime.pm',
    requires => {
        'Test::More' => 0,
        'version'    => 0,
    },
    add_to_cleanup      => [ 'Geo-Lookup-ByTime-*' ],
);

$builder->create_build_script();
