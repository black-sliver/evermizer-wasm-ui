<?php declare(strict_types=1);
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\TestCase;

// Test that item distribution tool produces correct output

final class DistributionTest extends TestCase
{
    private ?string $src_dir;

    #[RunInSeparateProcess, PreserveGlobalState(false)]
    public function testDistributionHtml(): void
    {
        $this->expectOutputRegex('/^<!DOCTYPE .*<html/is');
        $_GET["v"] = "v43";
        $_GET["settings"] = "";
        require("$this->src_dir/index.php");
    }

    // TODO: more tests for various $_GET combinations

    protected function setUp(): void
    {
        parent::setUp();
        $this->src_dir = __DIR__ . '/../distribution';
    }
}
