<?php declare(strict_types=1);
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\TestCase;

// Test that dist folder seems to be correctly created

final class DistTest extends TestCase
{
    private ?Array $manifest;
    private ?string $src_dir;
    private ?string $dist_dir;    

    public function testManifestContainsJS(): void
    {
        $this->assertGreaterThan(0, count(preg_grep('/\.js$/', $this->manifest)));
    }

    public function testManifestContainsCSS(): void
    {
        $this->assertGreaterThan(0, count(preg_grep('/\.css$/', $this->manifest)));
    }

    public function testManifestNoHTML(): void
    {
        $this->assertEquals(0, count(preg_grep('/\.html$/', $this->manifest)));
    }

    public function testManifestFilesExist(): void
    {
        foreach ($this->manifest as $orig => $renamed) {
            $this->assertFileExists("$this->src_dir/$orig");
            $this->assertFileExists("$this->dist_dir/$renamed");
        }
    }

    #[RunInSeparateProcess, PreserveGlobalState(false)]
    public function testIndexHtml(): void
    {
        $this->expectOutputRegex('/^<!DOCTYPE .*<html/is');
        require("$this->dist_dir/index.php");
    }

    #[RunInSeparateProcess, PreserveGlobalState(false)]
    public function testDistributionIndexHtml(): void
    {
        $this->expectOutputRegex('/^<!DOCTYPE .*<html/is');
        $_GET["v"] = "v43";
        $_GET["settings"] = "";
        require("$this->dist_dir/distribution/index.php");
    }

    protected function setUp(): void
    {
        $this->src_dir = __DIR__ . '/..';
        $this->dist_dir = __DIR__ . '/../dist';
        $this->manifest = require("$this->dist_dir/manifest.hash.php");
    }
}
